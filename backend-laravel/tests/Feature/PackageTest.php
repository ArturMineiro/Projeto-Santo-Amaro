<?php

namespace Tests\Feature;

use App\Mail\PackageArrivedMail;
use App\Models\Membership;
use App\Models\Package;
use App\Models\PackageNotification;
use App\Services\PackageNotifier;
use App\Services\WhatsApp\WhatsAppException;
use App\Services\WhatsApp\WhatsAppGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PackageTest extends TestCase
{
    use RefreshDatabase;

    /** Gateway falso que guarda as mensagens enviadas. */
    private function fakeWhatsApp(bool $fail = false): object
    {
        $gateway = new class($fail) implements WhatsAppGateway {
            public array $sent = [];

            public function __construct(private bool $fail)
            {
            }

            public function send(string $phone, string $message): ?string
            {
                if ($this->fail) {
                    throw new WhatsAppException('fora do ar');
                }
                $this->sent[] = compact('phone', 'message');

                return 'msg-1';
            }

            public function name(): string
            {
                return 'fake';
            }
        };

        $this->app->bind(PackageNotifier::class, fn () => new PackageNotifier($gateway));

        return $gateway;
    }

    public function test_admin_registers_package_and_resident_is_notified_by_whatsapp(): void
    {
        Mail::fake();
        $whatsapp = $this->fakeWhatsApp();

        $association = $this->makeAssociation(['name' => 'Associação Santo Amaro']);
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $resident = $this->makeMember($association, userAttributes: ['name' => 'Artur Silva', 'email' => null]);

        $response = $this->actingAs($admin->user)->postJson('/api/admin/packages', [
            'membership_id' => $resident->id,
            'type' => 'package',
            'description' => 'Caixa da Shopee',
        ]);

        $response->assertCreated()
            ->assertJsonPath('package.status', 'received')
            ->assertJsonPath('package.resident.name', 'Artur Silva');

        $this->assertCount(1, $whatsapp->sent);
        $this->assertSame($resident->user->phone, $whatsapp->sent[0]['phone']);
        $this->assertStringContainsString('Olá, Artur!', $whatsapp->sent[0]['message']);
        $this->assertStringContainsString('Associação Santo Amaro', $whatsapp->sent[0]['message']);
        $this->assertStringContainsString($response->json('package.pickup_code'), $whatsapp->sent[0]['message']);

        $package = Package::first();
        $this->assertNotNull($package->notified_at);
        $this->assertDatabaseHas('package_notifications', ['package_id' => $package->id, 'channel' => 'whatsapp', 'status' => 'sent']);
        Mail::assertNothingSent();
    }

    public function test_email_is_fallback_when_whatsapp_fails(): void
    {
        Mail::fake();
        $this->fakeWhatsApp(fail: true);

        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        // Mesmo com email desmarcado, o fallback deve funcionar
        $resident = $this->makeMember($association, userAttributes: ['email' => 'm@example.com', 'notify_email' => false]);

        $this->actingAs($admin->user)->postJson('/api/admin/packages', ['membership_id' => $resident->id])
            ->assertCreated();

        Mail::assertSent(PackageArrivedMail::class, fn ($mail) => $mail->hasTo('m@example.com'));
        $this->assertDatabaseHas('package_notifications', ['channel' => 'whatsapp', 'status' => 'failed']);
        $this->assertDatabaseHas('package_notifications', ['channel' => 'email', 'status' => 'sent']);
    }

    public function test_email_only_when_whatsapp_disabled(): void
    {
        Mail::fake();
        $this->app->bind(PackageNotifier::class, fn () => new PackageNotifier(null));

        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $resident = $this->makeMember($association, userAttributes: ['email' => 'm@example.com']);

        $this->actingAs($admin->user)->postJson('/api/admin/packages', ['membership_id' => $resident->id])
            ->assertCreated()
            ->assertJsonPath('package.whatsapp_link', fn ($link) => str_starts_with($link, 'https://wa.me/' . $resident->user->phone));

        Mail::assertSent(PackageArrivedMail::class);
        $this->assertSame(1, PackageNotification::count());
    }

    public function test_pickup_flow_with_code_validation_and_undo(): void
    {
        Mail::fake();
        $this->fakeWhatsApp();

        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $resident = $this->makeMember($association);

        $id = $this->actingAs($admin->user)
            ->postJson('/api/admin/packages', ['membership_id' => $resident->id])
            ->json('package.id');
        $package = Package::find($id);

        $this->postJson("/api/admin/packages/{$id}/pickup", ['pickup_code' => '0000'])
            ->assertStatus(422)->assertJsonValidationErrors('pickup_code');

        $this->postJson("/api/admin/packages/{$id}/pickup", ['pickup_code' => $package->pickup_code, 'picked_up_by_name' => 'Filha'])
            ->assertOk()->assertJsonPath('package.status', 'picked_up')->assertJsonPath('package.picked_up_by_name', 'Filha');

        $this->postJson("/api/admin/packages/{$id}/pickup")->assertStatus(422);

        $this->postJson("/api/admin/packages/{$id}/undo-pickup")->assertOk()->assertJsonPath('package.status', 'received');
    }

    public function test_resident_sees_only_own_packages(): void
    {
        Mail::fake();
        $this->fakeWhatsApp();

        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $me = $this->makeMember($association);
        $neighbor = $this->makeMember($association);

        $this->actingAs($admin->user)->postJson('/api/admin/packages', ['membership_id' => $me->id])->assertCreated();
        $this->actingAs($admin->user)->postJson('/api/admin/packages', ['membership_id' => $neighbor->id])->assertCreated();

        $response = $this->actingAs($me->user)->getJson('/api/my/packages')->assertOk();
        $this->assertCount(1, $response->json('waiting'));
        $this->assertCount(0, $response->json('history'));
        // Morador não recebe link de WhatsApp nem histórico de notificações
        $this->assertArrayNotHasKey('whatsapp_link', $response->json('waiting.0'));

        // Morador não acessa rotas de administração
        $this->actingAs($me->user)->getJson('/api/admin/packages')->assertForbidden();
    }

    public function test_admin_cannot_touch_other_association_data(): void
    {
        Mail::fake();
        $this->fakeWhatsApp();

        $a = $this->makeAssociation();
        $b = $this->makeAssociation();
        $adminA = $this->makeMember($a, Membership::ROLE_ADMIN);
        $adminB = $this->makeMember($b, Membership::ROLE_ADMIN);
        $residentB = $this->makeMember($b);

        // Não pode registrar encomenda para morador de outra associação
        $this->actingAs($adminA->user)->postJson('/api/admin/packages', ['membership_id' => $residentB->id])
            ->assertStatus(422);

        $id = $this->actingAs($adminB->user)->postJson('/api/admin/packages', ['membership_id' => $residentB->id])->json('package.id');

        $this->actingAs($adminA->user)->getJson("/api/admin/packages/{$id}")->assertNotFound();
        $this->actingAs($adminA->user)->postJson("/api/admin/packages/{$id}/pickup")->assertNotFound();
        $this->actingAs($adminA->user)->patchJson("/api/admin/residents/{$residentB->id}", ['unit' => 'x'])->assertNotFound();
    }

    public function test_package_list_filters_and_dashboard(): void
    {
        Mail::fake();
        $this->fakeWhatsApp();

        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $resident = $this->makeMember($association, userAttributes: ['name' => 'Benedita Souza']);
        $other = $this->makeMember($association, userAttributes: ['name' => 'Carlos Lima']);

        $this->actingAs($admin->user);
        $this->postJson('/api/admin/packages', ['membership_id' => $resident->id, 'description' => 'Remédio'])->assertCreated();
        $id = $this->postJson('/api/admin/packages', ['membership_id' => $other->id])->json('package.id');
        $this->postJson("/api/admin/packages/{$id}/pickup")->assertOk();

        $this->getJson('/api/admin/packages')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/packages?status=all')->assertJsonCount(2, 'data');
        $this->getJson('/api/admin/packages?search=benedita')->assertJsonCount(1, 'data');
        $this->getJson('/api/admin/packages?search=remédio')->assertJsonCount(1, 'data');

        $this->getJson('/api/admin/dashboard')->assertOk()
            ->assertJsonPath('waiting', 1)
            ->assertJsonPath('received_today', 2)
            ->assertJsonPath('picked_up_today', 1)
            ->assertJsonPath('residents', 3);
    }

    public function test_resend_notification(): void
    {
        Mail::fake();
        $whatsapp = $this->fakeWhatsApp();

        $association = $this->makeAssociation();
        $admin = $this->makeMember($association, Membership::ROLE_ADMIN);
        $resident = $this->makeMember($association, userAttributes: ['email' => null]);

        $id = $this->actingAs($admin->user)->postJson('/api/admin/packages', ['membership_id' => $resident->id])->json('package.id');
        $this->postJson("/api/admin/packages/{$id}/notify")->assertOk()->assertJsonCount(2, 'package.notifications');

        $this->assertCount(2, $whatsapp->sent);
    }
}

<?php

namespace Database\Seeders;

use App\Models\Association;
use App\Models\Membership;
use App\Models\Package;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Dados de demonstração.
 *   Admin:    (11) 90000-0001 / senha123
 *   Morador:  (11) 90000-0002 / senha123
 *   Código da associação: SANTO1
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $association = Association::create([
            'name' => 'Associação de Moradores Santo Amaro',
            'slug' => 'santo-amaro',
            'invite_code' => 'SANTO1',
            'address' => 'Rua da Comunidade, 100',
            'pickup_hours' => 'Seg a sex, 8h às 18h; sáb, 8h às 12h',
        ]);

        $admin = User::create([
            'name' => 'Maria Aparecida',
            'phone' => '5511900000001',
            'email' => 'admin@example.com',
            'password' => 'senha123',
        ]);

        Membership::create([
            'association_id' => $association->id,
            'user_id' => $admin->id,
            'role' => Membership::ROLE_ADMIN,
            'status' => Membership::STATUS_APPROVED,
            'unit' => 'Sede',
            'approved_at' => now(),
        ]);

        $residents = [
            ['Artur Silva', '5511900000002', 'artur@example.com', 'Casa 12', 'senha123'],
            ['Dona Benedita Souza', '5511900000003', null, 'Rua B, 45', null],
            ['José Carlos Lima', '5511900000004', null, 'Quadra 3, Lote 7', null],
            ['Ana Paula Ferreira', '5511900000005', 'ana@example.com', 'Casa 30', null],
        ];

        $memberships = [];
        foreach ($residents as [$name, $phone, $email, $unit, $password]) {
            $user = User::create(compact('name', 'phone', 'email', 'password'));
            $memberships[] = Membership::create([
                'association_id' => $association->id,
                'user_id' => $user->id,
                'role' => Membership::ROLE_RESIDENT,
                'status' => Membership::STATUS_APPROVED,
                'unit' => $unit,
                'approved_at' => now(),
                'approved_by' => $admin->id,
            ]);
        }

        // Um cadastro esperando aprovação
        $pending = User::create(['name' => 'Ricardo Gomes', 'phone' => '5511900000006', 'password' => 'senha123']);
        Membership::create([
            'association_id' => $association->id,
            'user_id' => $pending->id,
            'unit' => 'Casa 51',
        ]);

        $samples = [
            [0, 'package', 'Caixa média', 'Mercado Livre', 0],
            [0, 'letter', 'Conta de luz', 'Correios', 2],
            [1, 'package', 'Pacote pequeno', 'Shopee', 9],
            [2, 'document', 'Carta registrada', 'Correios', 1],
        ];

        foreach ($samples as [$i, $type, $description, $carrier, $daysAgo]) {
            Package::create([
                'association_id' => $association->id,
                'resident_id' => $memberships[$i]->user_id,
                'membership_id' => $memberships[$i]->id,
                'registered_by' => $admin->id,
                'type' => $type,
                'description' => $description,
                'carrier' => $carrier,
                'arrived_at' => now()->subDays($daysAgo)->subHours(2),
            ]);
        }

        // Histórico
        Package::create([
            'association_id' => $association->id,
            'resident_id' => $memberships[0]->user_id,
            'membership_id' => $memberships[0]->id,
            'registered_by' => $admin->id,
            'type' => 'package',
            'description' => 'Livro',
            'carrier' => 'Amazon',
            'status' => Package::STATUS_PICKED_UP,
            'arrived_at' => now()->subDays(15),
            'picked_up_at' => now()->subDays(14),
            'delivered_by' => $admin->id,
        ]);
    }
}

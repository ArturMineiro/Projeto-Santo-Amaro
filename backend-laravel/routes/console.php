<?php

use App\Models\User;
use App\Support\Phone;
use Illuminate\Support\Facades\Artisan;

/*
| Cria ou promove a pessoa que administra o SISTEMA (vê todas as associações).
|   php artisan sistema:admin "(11) 98888-7777" --nome="Artur" --senha="uma-senha-forte"
| Sem --senha, pergunta no terminal. Se o telefone já existe, só promove.
*/
Artisan::command('sistema:admin {telefone} {--nome=Administração do sistema} {--senha=} {--remover}', function () {
    $phone = Phone::normalize($this->argument('telefone'));

    if (! Phone::isValid($phone)) {
        $this->error('Telefone inválido. Use DDD + número, ex.: (11) 98888-7777');

        return 1;
    }

    $user = User::where('phone', $phone)->first();

    if ($this->option('remover')) {
        if (! $user) {
            $this->error('Ninguém com esse telefone.');

            return 1;
        }
        $user->forceFill(['is_super_admin' => false])->save();
        $this->info("{$user->name} não administra mais o sistema.");

        return 0;
    }

    $password = $this->option('senha');
    if (! $user && ! $password) {
        $password = $this->secret('Senha para o novo acesso (mínimo 8 caracteres)');
    }
    if ($password !== null && strlen($password) < 8) {
        $this->error('A senha precisa ter pelo menos 8 caracteres.');

        return 1;
    }

    $user ??= new User(['name' => $this->option('nome'), 'phone' => $phone]);
    if ($password) {
        $user->password = $password;
    }
    $user->forceFill(['is_super_admin' => true, 'is_active' => true])->save();

    $this->info("Pronto: {$user->name} (" . Phone::format($phone) . ') administra o sistema. Entre no site e acesse /sistema.');

    return 0;
})->purpose('Cria ou promove um administrador do sistema inteiro');

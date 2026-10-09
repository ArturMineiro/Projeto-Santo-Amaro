<?php

use App\Http\Controllers\Api\AssociationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MyPackageController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\ResidentController;
use App\Http\Controllers\Api\SystemController;
use Illuminate\Support\Facades\Route;

/*
| Rotas públicas — com limite de tentativas para evitar força bruta
*/
Route::middleware('throttle:20,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register-association', [AuthController::class, 'registerAssociation']);
    Route::post('/auth/register', [AuthController::class, 'registerResident']);
    Route::get('/invites/{code}', [AuthController::class, 'lookupInvite']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Qualquer membro aprovado
    Route::middleware('association')->group(function () {
        Route::get('/my/packages', [MyPackageController::class, 'index']);
        Route::get('/association', [AssociationController::class, 'show']);
    });

    // Administração da associação
    Route::middleware('association:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AssociationController::class, 'dashboard']);
        Route::patch('/association', [AssociationController::class, 'update']);
        Route::post('/association/invite-code', [AssociationController::class, 'regenerateInviteCode']);

        Route::get('/residents', [ResidentController::class, 'index']);
        Route::post('/residents', [ResidentController::class, 'store']);
        Route::get('/residents/{membership}', [ResidentController::class, 'show']);
        Route::patch('/residents/{membership}', [ResidentController::class, 'update']);
        Route::delete('/residents/{membership}', [ResidentController::class, 'destroy']);
        Route::post('/residents/{membership}/approve', [ResidentController::class, 'approve']);
        Route::post('/residents/{membership}/reject', [ResidentController::class, 'reject']);

        Route::get('/packages', [PackageController::class, 'index']);
        Route::post('/packages', [PackageController::class, 'store']);
        Route::get('/packages/{package}', [PackageController::class, 'show']);
        Route::patch('/packages/{package}', [PackageController::class, 'update']);
        Route::delete('/packages/{package}', [PackageController::class, 'destroy']);
        Route::post('/packages/{package}/pickup', [PackageController::class, 'pickup']);
        Route::post('/packages/{package}/undo-pickup', [PackageController::class, 'undoPickup']);
        Route::post('/packages/{package}/notify', [PackageController::class, 'notify']);
        Route::post('/packages/{package}/notified-manually', [PackageController::class, 'notifiedManually']);
    });

    // Administração do sistema inteiro (super admin)
    Route::middleware('superadmin')->prefix('system')->group(function () {
        Route::get('/overview', [SystemController::class, 'overview']);
        Route::get('/associations', [SystemController::class, 'associations']);
        Route::get('/associations/{association}', [SystemController::class, 'showAssociation']);
        Route::patch('/associations/{association}', [SystemController::class, 'updateAssociation']);
        Route::get('/memberships', [SystemController::class, 'memberships']);
        Route::get('/activity', [SystemController::class, 'activity']);
        Route::get('/notifications', [SystemController::class, 'notifications']);
        Route::get('/app-log', [SystemController::class, 'appLog']);
    });
});

<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\PublicSupportController;
use App\Http\Controllers\SupportController;
use App\Http\Controllers\TechnicianController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/login', [AuthController::class, 'login']);

Route::prefix('public')->group(function () {
    Route::post('/supports', [PublicSupportController::class, 'store']);
    Route::get('/supports/status', [PublicSupportController::class, 'status']);
    Route::get('/supports/{codigo_soporte}', [PublicSupportController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'role:administrador,tecnico'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/supports', [SupportController::class, 'index']);
    Route::post('/supports', [SupportController::class, 'store']);
    Route::get('/supports/company-suggestions', [SupportController::class, 'companySuggestions']);
    Route::get('/supports/{support}', [SupportController::class, 'show']);
    Route::patch('/supports/{support}', [SupportController::class, 'update']);
    Route::patch('/supports/{support}/cell', [SupportController::class, 'updateCell']);
    Route::delete('/supports/{support}', [SupportController::class, 'destroy']);

    Route::get('/technicians', [TechnicianController::class, 'index']);
    Route::get('/company-settings', [CompanySettingController::class, 'show']);
    Route::patch('/company-settings', [CompanySettingController::class, 'update']);
    Route::post('/technicians', [CompanySettingController::class, 'storeTechnician']);
    Route::patch('/technicians/{user}', [CompanySettingController::class, 'updateTechnician']);
    Route::delete('/technicians/{user}', [CompanySettingController::class, 'destroyTechnician']);
    Route::get('/administrators', [CompanySettingController::class, 'administrators']);
    Route::post('/administrators', [CompanySettingController::class, 'storeAdministrator']);
    Route::patch('/administrators/{user}', [CompanySettingController::class, 'updateAdministrator']);
    Route::delete('/administrators/{user}', [CompanySettingController::class, 'destroyAdministrator']);
});

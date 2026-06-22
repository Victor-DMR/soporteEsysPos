<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class TechnicianController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'technicians' => User::query()
                ->where('role', 'tecnico')
                ->where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'phone']),
        ]);
    }
}

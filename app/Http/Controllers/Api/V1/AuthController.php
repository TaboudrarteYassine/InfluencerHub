<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Registration successful. Please verify your email.',
            'data'    => [
                'user'  => array_merge($result['user']->toArray(), ['role' => $result['user']->role]),
                'token' => $result['token'],
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated(),
            $request->ip()
        );

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data'    => [
                'user'  => array_merge($result['user']->toArray(), ['role' => $result['user']->role]),
                'token' => $result['token'],
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $this->authService->logoutAllDevices($request->user());

        return response()->json([
            'success' => true,
            'message' => 'All devices logged out.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['influencerProfile.socialAccounts', 'clientProfile']);

        return response()->json([
            'success' => true,
            'data'    => ['user' => array_merge($user->toArray(), ['role' => $user->role])],
        ]);
    }

    public function checkUsername(Request $request): JsonResponse
    {
        $request->validate(['username' => 'required|string|min:3|max:30']);
        $username = strtolower($request->username);
        
        $exists = \App\Models\User::where('username', $username)
            ->where('id', '!=', $request->user()->id)
            ->exists();
            
        return response()->json([
            'success' => true,
            'data'    => ['available' => !$exists],
        ]);
    }
}

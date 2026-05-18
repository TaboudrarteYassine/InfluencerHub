<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email|max:255',
            'password' => 'required|min:8|confirmed',
            'role'     => 'required|in:influencer,client',
            'phone'    => 'nullable|string|max:20',
        ];
    }

    public function authorize(): bool { return true; }
}

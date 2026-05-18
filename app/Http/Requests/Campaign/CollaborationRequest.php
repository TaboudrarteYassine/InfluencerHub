<?php

namespace App\Http\Requests\Campaign;

use Illuminate\Foundation\Http\FormRequest;

class CollaborationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'influencer_id'  => 'required|integer|exists:users,id',
            'proposed_amount'=> 'nullable|numeric|min:0',
            'message'        => 'nullable|string|max:2000',
        ];
    }

    public function authorize(): bool { return true; }
}

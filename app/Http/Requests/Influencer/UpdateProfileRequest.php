<?php

namespace App\Http\Requests\Influencer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'display_name'       => 'nullable|string|max:100',
            'bio'                => 'nullable|string|max:2000',
            'profile_picture_file' => 'nullable|image|max:5120',
            'cover_image_file'   => 'nullable|image|max:10240',
            'country'            => 'nullable|string|max:100',
            'city'               => 'nullable|string|max:100',
            'languages'          => 'nullable|array',
            'languages.*'        => 'string|max:50',
            'niches'             => 'nullable|array',
            'niches.*'           => 'string|max:50',
            'price_min'          => 'nullable|numeric|min:0',
            'price_max'          => 'nullable|numeric|min:0|gte:price_min',
            'availability'       => 'nullable|in:available,busy,unavailable',
        ];
    }

    public function authorize(): bool { return true; }
}

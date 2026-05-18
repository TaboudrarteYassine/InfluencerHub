<?php

namespace App\Http\Requests\Influencer;

use Illuminate\Foundation\Http\FormRequest;

class AddSocialAccountRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'platform'       => 'required|in:tiktok,instagram,youtube,twitter,facebook',
            'username'       => 'required|string|max:100',
            'profile_url'    => 'nullable|url|max:500',
            'followers_count'=> 'required|integer|min:0',
            'engagement_rate'=> 'nullable|numeric|min:0|max:100',
            'avg_likes'      => 'nullable|numeric|min:0',
            'avg_comments'   => 'nullable|numeric|min:0',
            'avg_views'      => 'nullable|numeric|min:0',
        ];
    }

    public function authorize(): bool { return true; }
}

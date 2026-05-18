<?php

namespace App\Http\Requests\Campaign;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCampaignRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title'               => 'sometimes|string|max:200',
            'description'         => 'sometimes|string|max:10000',
            'deliverables'        => 'nullable|string|max:5000',
            'category_id'         => 'nullable|integer|exists:categories,id',
            'platforms'           => 'nullable|array',
            'platforms.*'         => 'in:tiktok,instagram,youtube,twitter,facebook',
            'budget_min'          => 'nullable|numeric|min:0',
            'budget_max'          => 'nullable|numeric|min:0|gte:budget_min',
            'deadline'            => 'nullable|date|after:today',
            'country'             => 'nullable|string|max:100',
            'target_niches'       => 'nullable|array',
            'target_niches.*'     => 'string|max:50',
            'min_followers'       => 'nullable|integer|min:0',
            'min_engagement_rate' => 'nullable|numeric|min:0|max:100',
        ];
    }

    public function authorize(): bool { return true; }
}

<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use App\Models\ActivityLog;

class AdminSettingsService
{
    public function getSettings()
    {
        return Setting::all()->pluck('value', 'key')->toArray();
    }

    public function updateSettings(array $data, int $adminId)
    {
        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? 'true' : 'false') : $value]
            );
        }
        
        Cache::forget('settings.maintenance_mode');
        
        ActivityLog::create([
            'user_id' => $adminId,
            'action' => 'update_settings',
            'entity_type' => 'System',
            'entity_id' => 0,
            'description' => 'Platform settings updated',
            'ip_address' => request()->ip()
        ]);
        
        return true;
    }
}

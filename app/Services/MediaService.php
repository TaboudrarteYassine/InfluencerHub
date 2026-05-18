<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MediaService
{
    /**
     * Upload user avatar
     */
    public function uploadAvatar(UploadedFile $file, int $userId): string
    {
        $this->validateAvatar($file);

        $uuid = Str::uuid()->toString();
        $extension = $file->getClientOriginalExtension();
        $path = "avatars/{$userId}/{$uuid}.{$extension}";

        // Upload to configured disk (default public or s3)
        $disk = config('filesystems.default', 'public');
        Storage::disk($disk)->put($path, file_get_contents($file));

        return Storage::disk($disk)->url($path);
    }

    public function upload(UploadedFile $file, string $folder): string
    {
        $uuid = Str::uuid()->toString();
        $extension = $file->getClientOriginalExtension();
        $path = "{$folder}/{$uuid}.{$extension}";
        
        $disk = config('filesystems.default', 'public');
        Storage::disk($disk)->put($path, file_get_contents($file));
        
        return Storage::disk($disk)->url($path);
    }

    public function uploadKYC(UploadedFile $file, int $userId, string $type): string
    {
        // $type can be 'cin_front' or 'selfie'
        $path = "kyc/{$userId}/{$type}.jpg";
        
        // Private disk, or local
        Storage::disk('local')->put($path, file_get_contents($file));
        
        return $path;
    }

    /**
     * Upload chat attachment
     */
    public function uploadChatAttachment(UploadedFile $file, int $conversationId): array
    {
        $this->validateChatAttachment($file);

        $uuid = Str::uuid()->toString();
        $extension = $file->getClientOriginalExtension();
        $path = "chat/{$conversationId}/{$uuid}.{$extension}";

        $disk = config('filesystems.default', 'public');
        Storage::disk($disk)->put($path, file_get_contents($file));

        return [
            'url'           => Storage::disk($disk)->url($path),
            'type'          => $this->detectAttachmentType($file),
            'original_name' => $file->getClientOriginalName(),
            'size'          => $file->getSize(),
        ];
    }

    /**
     * Validate avatar image
     */
    private function validateAvatar(UploadedFile $file): void
    {
        $maxSize = 2048; // 2MB
        $allowedExts = ['jpeg', 'png', 'jpg', 'webp'];
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

        if ($file->getSize() / 1024 > $maxSize) {
            throw ValidationException::withMessages(['avatar' => ['Avatar size cannot exceed 2MB.']]);
        }

        if (!in_array(strtolower($file->getClientOriginalExtension()), $allowedExts) ||
            !in_array($file->getMimeType(), $allowedMimes)) {
            throw ValidationException::withMessages(['avatar' => ['Invalid image format. Allowed: jpeg, png, jpg, webp.']]);
        }
    }

    /**
     * Validate chat attachment
     */
    private function validateChatAttachment(UploadedFile $file): void
    {
        $maxSize = 10240; // 10MB
        $disallowedExts = ['exe', 'php', 'sh', 'bat', 'js', 'cmd', 'vbs'];

        if ($file->getSize() / 1024 > $maxSize) {
            throw ValidationException::withMessages(['attachment' => ['Attachment size cannot exceed 10MB.']]);
        }

        if (in_array(strtolower($file->getClientOriginalExtension()), $disallowedExts)) {
            throw ValidationException::withMessages(['attachment' => ['Executable files are not allowed.']]);
        }
    }

    /**
     * Detect file type
     */
    private function detectAttachmentType(UploadedFile $file): string
    {
        $images = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $videos = ['mp4', 'mov', 'avi'];
        $ext    = strtolower($file->getClientOriginalExtension());

        if (in_array($ext, $images)) return 'image';
        if (in_array($ext, $videos)) return 'video';
        return 'file';
    }
}

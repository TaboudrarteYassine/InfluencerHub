<?php

namespace App\Services;

use App\Models\Category;
use App\Models\ActivityLog;

class AdminCategoryService
{
    public function listCategories()
    {
        return Category::withCount('campaigns')->get();
    }

    public function createCategory(array $data, int $adminId): Category
    {
        $category = Category::create($data);
        $this->logAction($adminId, 'create_category', 'Category', $category->id, null, $category->name, null);
        return $category;
    }

    public function updateCategory(int $id, array $data, int $adminId): Category
    {
        $category = Category::findOrFail($id);
        $old = $category->name;
        $category->update($data);
        $this->logAction($adminId, 'update_category', 'Category', $id, $old, $category->name, null);
        return $category;
    }

    public function deleteCategory(int $id, int $adminId)
    {
        $category = Category::findOrFail($id);
        $category->delete(); // Soft deletes if configured
        $this->logAction($adminId, 'delete_category', 'Category', $id, null, null, 'Category deleted');
        return true;
    }

    public function toggleVisibility(int $id, int $adminId): Category
    {
        $category = Category::findOrFail($id);
        $category->is_active = !$category->is_active;
        $category->save();
        $this->logAction($adminId, 'toggle_category_visibility', 'Category', $id, null, (string)$category->is_active, null);
        return $category;
    }

    private function logAction(int $adminId, string $action, string $entityType, int $entityId, ?string $oldValue, ?string $newValue, ?string $description)
    {
        ActivityLog::create([
            'user_id' => $adminId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValue,
            'new_values' => $newValue,
            'description' => $description,
            'ip_address' => request()->ip()
        ]);
    }
}

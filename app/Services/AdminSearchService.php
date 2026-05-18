<?php

namespace App\Services;

use App\Models\User;
use App\Models\Campaign;
use App\Models\Review;

class AdminSearchService
{
    public function globalSearch(string $query)
    {
        if (strlen($query) < 2) return [];

        $users = User::where('name', 'like', "%$query%")
            ->orWhere('email', 'like', "%$query%")
            ->take(5)->get()->map(function($u) {
                return ['type' => 'user', 'id' => $u->id, 'title' => $u->name, 'subtitle' => $u->email, 'link' => '/admin/users'];
            });

        $campaigns = Campaign::where('title', 'like', "%$query%")
            ->take(5)->get()->map(function($c) {
                return ['type' => 'campaign', 'id' => $c->id, 'title' => $c->title, 'subtitle' => ucfirst($c->status), 'link' => '/admin/campaigns'];
            });

        $reviews = Review::whereHas('reviewer', function($q) use ($query) {
            $q->where('name', 'like', "%$query%");
        })->take(5)->get()->map(function($r) {
            return ['type' => 'review', 'id' => $r->id, 'title' => 'Review by ' . ($r->reviewer->name ?? 'Unknown'), 'subtitle' => "Rating: {$r->rating} Stars", 'link' => '/admin/reviews'];
        });

        return collect([])->merge($users)->merge($campaigns)->merge($reviews)->toArray();
    }
}

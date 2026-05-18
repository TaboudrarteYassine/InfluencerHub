<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\InfluencerRepositoryInterface;
use App\Repositories\Contracts\CampaignRepositoryInterface;
use App\Repositories\Eloquent\UserRepository;
use App\Repositories\Eloquent\InfluencerRepository;
use App\Repositories\Eloquent\CampaignRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(InfluencerRepositoryInterface::class, InfluencerRepository::class);
        $this->app->bind(CampaignRepositoryInterface::class, CampaignRepository::class);
    }
}

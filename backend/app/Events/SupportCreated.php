<?php

namespace App\Events;

use App\Models\Support;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupportCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Support $support)
    {
        $this->support->loadMissing('technician');
    }

    public function broadcastOn(): Channel
    {
        return new Channel('supports');
    }

    public function broadcastAs(): string
    {
        return 'SupportCreated';
    }

    public function broadcastWith(): array
    {
        return ['support' => $this->support->toArray()];
    }
}

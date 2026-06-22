<?php

namespace App\Events;

use App\Models\Support;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupportUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public Support $support, public ?array $updatedBy = null)
    {
        $this->support->loadMissing('technician');
    }

    public function broadcastOn(): array
    {
        return [new Channel('supports'), new Channel('support.'.$this->support->id)];
    }

    public function broadcastAs(): string
    {
        return 'SupportUpdated';
    }

    public function broadcastWith(): array
    {
        return ['support' => $this->support->toArray(), 'updated_by' => $this->updatedBy];
    }
}

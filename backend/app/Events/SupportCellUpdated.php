<?php

namespace App\Events;

use App\Models\Support;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SupportCellUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Support $support,
        public string $field,
        public mixed $value,
        public ?array $updatedBy = null
    ) {
        $this->support->loadMissing('technician');
    }

    public function broadcastOn(): array
    {
        return [new Channel('supports'), new Channel('support.'.$this->support->id)];
    }

    public function broadcastAs(): string
    {
        return 'SupportCellUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'support_id' => $this->support->id,
            'field' => $this->field,
            'value' => $this->value,
            'updated_by' => $this->updatedBy,
            'support' => $this->support->toArray(),
        ];
    }
}

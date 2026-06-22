<?php

namespace App\Http\Controllers;

use App\Events\SupportCreated;
use App\Http\Requests\PublicStatusRequest;
use App\Http\Requests\PublicStoreSupportRequest;
use App\Models\Support;
use App\Support\SupportErrorImageStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PublicSupportController extends Controller
{
    public function store(PublicStoreSupportRequest $request): JsonResponse
    {
        $support = DB::transaction(function () use ($request) {
            $imagePaths = SupportErrorImageStorage::storeFromRequest($request);

            $support = Support::create([
                'codigo_soporte' => $this->temporarySupportCode(),
                'fecha' => now()->toDateString(),
                'nit' => $this->clean($request->nit),
                'empresa' => $this->clean($request->empresa),
                'detalles_soporte' => $this->clean($request->detalles_soporte),
                'telefono' => $this->clean($request->telefono),
                'anydesk' => $this->clean($request->anydesk),
                'error_image_path' => $imagePaths[0] ?? null,
                'error_image_paths' => $imagePaths ?: null,
                'hora_registro' => now()->format('H:i'),
                'estado_soporte' => 'pendiente',
            ]);
            $support->forceFill(['codigo_soporte' => $this->supportCode($support)])->save();

            $support->logs()->create([
                'action' => 'public_created',
                'new_value' => json_encode($support->toArray()),
            ]);

            return $support;
        });

        event(new SupportCreated($support));

        return response()->json(['support' => $support->publicPayload()], 201);
    }

    public function status(PublicStatusRequest $request): JsonResponse
    {
        $support = $this->findPublicSupport(
            $request->input('codigo_soporte', $request->input('codigo')),
        );

        return response()->json(['support' => $support->publicPayload()]);
    }

    public function show(Request $request, string $codigo_soporte): JsonResponse
    {
        $request->validate([
        ]);

        $support = $this->findPublicSupport($codigo_soporte);

        return response()->json(['support' => $support->publicPayload()]);
    }

    public function findPublicSupport(string $code): Support
    {
        return Support::where('codigo_soporte', $code)->firstOrFail();
    }

    private function clean(?string $value): ?string
    {
        return $value === null ? null : trim(strip_tags($value));
    }

    private function temporarySupportCode(): string
    {
        return 'TMP-'.Str::uuid()->toString();
    }

    private function supportCode(Support $support): string
    {
        return 'SOP-'.now()->format('Ymd').'-'.str_pad((string) $support->id, 4, '0', STR_PAD_LEFT);
    }
}

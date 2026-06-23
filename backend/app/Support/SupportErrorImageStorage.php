<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SupportErrorImageStorage
{
    private const DIRECTORY = 'support-errors';
    public const MAX_FILES = 8;
    private const MAX_SIDE = 1600;
    private const WEBP_QUALITY = 76;

    public static function storeFromRequest(Request $request): array
    {
        $files = $request->file('error_images', []);
        if ($request->hasFile('error_image')) {
            array_unshift($files, $request->file('error_image'));
        }

        return collect($files)
            ->filter()
            ->take(self::MAX_FILES)
            ->map(fn (UploadedFile $file) => self::storeAsWebp($file))
            ->values()
            ->all();
    }

    private static function storeAsWebp(UploadedFile $file): string
    {
        $path = self::DIRECTORY.'/'.Str::uuid().'.webp';
        $webp = self::convertToWebp($file);

        if ($webp !== null) {
            Storage::disk('public')->put($path, $webp);

            return $path;
        }

        return $file->store(self::DIRECTORY, 'public');
    }

    private static function convertToWebp(UploadedFile $file): ?string
    {
        if (! function_exists('imagecreatefromstring') || ! function_exists('imagewebp')) {
            return null;
        }

        $source = @imagecreatefromstring($file->getContent());
        if (! $source) {
            return null;
        }

        self::applyJpegOrientation($source, $file);

        $width = imagesx($source);
        $height = imagesy($source);
        [$targetWidth, $targetHeight] = self::targetSize($width, $height);

        $target = imagecreatetruecolor($targetWidth, $targetHeight);
        if (! $target) {
            imagedestroy($source);

            return null;
        }

        imagealphablending($target, false);
        imagesavealpha($target, true);

        $transparent = imagecolorallocatealpha($target, 0, 0, 0, 127);
        imagefilledrectangle($target, 0, 0, $targetWidth, $targetHeight, $transparent);

        imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        ob_start();
        $success = imagewebp($target, null, self::WEBP_QUALITY);
        $webp = ob_get_clean();

        imagedestroy($source);
        imagedestroy($target);

        return $success && $webp !== false ? $webp : null;
    }

    private static function targetSize(int $width, int $height): array
    {
        $longestSide = max($width, $height);
        if ($longestSide <= self::MAX_SIDE) {
            return [$width, $height];
        }

        $ratio = self::MAX_SIDE / $longestSide;

        return [
            max(1, (int) round($width * $ratio)),
            max(1, (int) round($height * $ratio)),
        ];
    }

    private static function applyJpegOrientation(\GdImage &$image, UploadedFile $file): void
    {
        if (! function_exists('exif_read_data') || ! str_contains((string) $file->getMimeType(), 'jpeg')) {
            return;
        }

        $exif = @exif_read_data($file->getRealPath());
        $orientation = (int) ($exif['Orientation'] ?? 1);

        $rotated = match ($orientation) {
            3 => imagerotate($image, 180, 0),
            6 => imagerotate($image, -90, 0),
            8 => imagerotate($image, 90, 0),
            default => false,
        };

        if ($rotated) {
            imagedestroy($image);
            $image = $rotated;
        }
    }
}

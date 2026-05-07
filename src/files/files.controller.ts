import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiTags, ApiOperation } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads', 'audio');

const ALLOWED = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];
const MAX_SIZE_MB = 300;

// Ensure upload directory exists on startup
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@ApiTags('Files')
@Controller('files')
export class FilesController {

  @Post('audio')
  @ApiOperation({ summary: 'Subir una pista de audio' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          // Sanitize: keep only safe chars, prepend timestamp
          const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${Date.now()}-${safe}`);
        },
      }),
      limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ALLOWED.includes(ext)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Formato no soportado. Usa: ${ALLOWED.join(', ')}`,
            ),
            false,
          );
        }
      },
    }),
  )
  uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');

    const base =
      process.env.API_URL ?? 'http://localhost:3001/api/v1';

    return {
      url: `${base}/files/audio/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Get('audio/:filename')
  @ApiOperation({ summary: 'Obtener una pista de audio' })
  serveAudio(@Param('filename') filename: string, @Res() res: Response) {
    // Guard against path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new BadRequestException('Nombre de archivo inválido');
    }

    const filePath = join(UPLOAD_DIR, filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // sendFile handles Range requests (seek) and Content-Type automatically
    res.sendFile(filePath);
  }
}

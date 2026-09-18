import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotifyTeamDto {
  @ApiProperty({ example: 'https://cdfe-web.vercel.app/services/clv01abc' })
  @IsUrl({ require_tld: false })
  serviceUrl: string;
}

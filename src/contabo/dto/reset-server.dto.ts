import { OmitType } from '@nestjs/swagger';

import { CreateServerDto } from './create-server.dto';

export class ResetServerDto extends OmitType(CreateServerDto, ['password']) {}

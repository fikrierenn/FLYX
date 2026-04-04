import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FSLService } from './fsl.service';

class CompileDto {
  source!: string;
}

@ApiTags('fsl')
@Controller('fsl')
export class FSLController {
  constructor(private readonly fslService: FSLService) {}

  @Post('compile')
  @ApiOperation({ summary: 'Compile FSL source code to AST' })
  compile(@Body() dto: CompileDto) {
    return this.fslService.compile(dto.source);
  }

  @Post('generate-sql')
  @ApiOperation({ summary: 'Generate SQL from FSL source code' })
  generateSQL(@Body() dto: CompileDto) {
    return this.fslService.generateSQL(dto.source);
  }
}

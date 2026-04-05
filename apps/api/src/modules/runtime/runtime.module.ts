import { Module } from '@nestjs/common';
import { RuntimeService } from './runtime.service';
import { RuntimeController } from './runtime.controller';

@Module({
  providers: [RuntimeService],
  controllers: [RuntimeController],
  exports: [RuntimeService],
})
export class RuntimeModule {}

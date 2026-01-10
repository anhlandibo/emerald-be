import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  constructor(private readonly defaultValue?: number) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    if (!value && this.defaultValue !== undefined) {
      return this.defaultValue;
    }

    const val = parseInt(value, 10);
    if (isNaN(val)) {
      return this.defaultValue !== undefined ? this.defaultValue : 0;
    }
    return val;
  }
}

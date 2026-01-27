import { Prop } from '@nestjs/mongoose';

export class NameSchema {
  @Prop({ type: String, required: true })
  hi: string;

  @Prop({ type: String, required: true })
  en: string;
}

export class DescriptionSchema {
  @Prop({ type: String })
  hi?: string;

  @Prop({ type: String })
  en?: string;
}

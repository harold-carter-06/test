import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Admin {
  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  userName: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

}
export const AdminSchema = SchemaFactory.createForClass(Admin);

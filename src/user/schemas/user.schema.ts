import { Schema, Prop, SchemaFactory, raw } from "@nestjs/mongoose";
import { Gender } from "../../helper/enum";
import * as bcrypt from "bcrypt";

@Schema({ timestamps: true })
export class User {
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

  @Prop({
    enum: [Gender.MALE, Gender.FEMALE, Gender.OTHERS, Gender.NOTTOSAY],
    default: Gender.NOTTOSAY,
  })
  gender: string;

  @Prop()
  dateOfBirth: string;

  @Prop()
  phone: string;

  @Prop(
    raw({
      otp: { type: String },
      otpCreatedAt: { type: Number },
      otpExpiredAt: { type: Number },
    })
  )
  otpDetails: Record<string, any>;

  @Prop()
  isActive: Boolean;

  @Prop()
  isDeleted: Boolean;

  @Prop()
  createdAt: Number;

  @Prop()
  updatedAt: Number;
}
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre("save", function (next: any) {
  const user = this;
  console.log("user", user);
  if (user.password) {
    bcrypt.hash(user.password, 10, function (err: any, hash: any) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  }
  next();
});

import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export interface createNewActivityEvent {
  created_by_user_id: Types.ObjectId | null;
  activity_name: string;
  desc: string;
  activity_type: string;
  collection_name: string;
  document_id: string | null;
  action_link: string;
  domain: string;
}

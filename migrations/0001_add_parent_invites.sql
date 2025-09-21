
CREATE TABLE "parent_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" varchar NOT NULL,
	"parent_user_id" varchar,
	"invite_code" varchar(50) NOT NULL,
	"parent_name" varchar(255) NOT NULL,
	"parent_email" varchar(255) NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"student_id" varchar NOT NULL,
	"phone_number" varchar(50),
	"claimed" boolean DEFAULT false,
	"claimed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "parent_invites_invite_code_unique" UNIQUE("invite_code")
);

ALTER TABLE "parent_invites" ADD CONSTRAINT "parent_invites_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "parent_invites" ADD CONSTRAINT "parent_invites_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

ALTER TABLE "parent_invites" ADD CONSTRAINT "parent_invites_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;

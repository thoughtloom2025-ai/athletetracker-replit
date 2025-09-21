
CREATE TABLE "parent_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" varchar NOT NULL,
	"invite_code" varchar(50) NOT NULL,
	"parent_name" varchar(255) NOT NULL,
	"parent_email" varchar(255) NOT NULL,
	"student_name" varchar(255) NOT NULL,
	"phone_number" varchar(50),
	"joined_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "parent_invites_invite_code_unique" UNIQUE("invite_code")
);

ALTER TABLE "parent_invites" ADD CONSTRAINT "parent_invites_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

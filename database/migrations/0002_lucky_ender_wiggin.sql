ALTER TABLE "swipes" RENAME TO "hearts";--> statement-breakpoint
ALTER TABLE "hearts" RENAME COLUMN "swiper_user_id" TO "hearter_user_id";--> statement-breakpoint
ALTER TABLE "hearts" RENAME COLUMN "swiped_snack_id" TO "hearter_snack_id";--> statement-breakpoint
ALTER TABLE "hearts" DROP CONSTRAINT "swipes_swiper_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "hearts" DROP CONSTRAINT "swipes_swiped_snack_id_snacks_id_fk";
--> statement-breakpoint
ALTER TABLE "hearts" ADD CONSTRAINT "hearts_hearter_user_id_users_id_fk" FOREIGN KEY ("hearter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hearts" ADD CONSTRAINT "hearts_hearter_snack_id_snacks_id_fk" FOREIGN KEY ("hearter_snack_id") REFERENCES "public"."snacks"("id") ON DELETE cascade ON UPDATE no action;
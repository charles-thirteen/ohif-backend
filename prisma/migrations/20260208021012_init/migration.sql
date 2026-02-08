-- CreateTable
CREATE TABLE "user_preferences" (
    "user_id" VARCHAR(255) NOT NULL,
    "data" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_annotations" (
    "user_id" VARCHAR(255) NOT NULL,
    "study_uid" VARCHAR(255) NOT NULL,
    "data" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_annotations_pkey" PRIMARY KEY ("user_id","study_uid")
);

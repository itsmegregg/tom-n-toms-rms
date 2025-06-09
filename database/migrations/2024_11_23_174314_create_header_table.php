<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('header', function (Blueprint $table) {
            $table->id('header_id');
            $table->foreignId('branch_id')->constrained('branches', 'branch_id');
            $table->foreignId('concept_id')->constrained('concepts', 'concept_id');
            $table->date('date');
            $table->string('reg', 25);
            $table->string('or_from', 30);
            $table->string('or_to', 30);
            $table->decimal('beg_balance', 12, 2);
            $table->decimal('end_balance', 12, 2);
            $table->integer('no_transaction');
            $table->integer('no_guest');
            $table->integer('reg_guest');
            $table->integer('ftime_guest');
            $table->integer('no_void');
            $table->integer('no_disc');
            $table->decimal('other_disc', 12, 2)->default(0);
            $table->decimal('senior_disc', 12, 2)->default(0);
            $table->decimal('pwd_disc', 12, 2)->default(0);
            $table->decimal('open_disc', 12, 2)->default(0);
            $table->decimal('vip_disc', 12, 2)->default(0);
            $table->decimal('employee_disc', 12, 2)->default(0);
            $table->decimal('promo_disc', 12, 2)->default(0);
            $table->decimal('free_disc', 12, 2)->default(0);
            $table->integer('no_cancel');
            $table->decimal('room_charge', 12, 2)->default(0);
            $table->string('z_count');
            $table->timestamps();

            // Create indexes for better query performance
            $table->index('date');
            $table->index('branch_id');
            $table->index('concept_id');
            $table->index(['date', 'branch_id', 'concept_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('header');
    }
};

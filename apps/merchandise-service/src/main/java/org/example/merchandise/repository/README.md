# repository

## Purpose
Provides reactive database access for product merchandise data.

## Behavior
Uses Spring Data R2DBC for non-blocking database operations with pagination and category filtering support.

## Quirks
- SKU is the primary key (not auto-generated)
- Timestamps (createdAt, updatedAt) managed by database triggers

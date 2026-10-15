-- Fix: Ensure RolePermission has primary key if missing after stage12.
-- Idempotent: uses information_schema to avoid regclass resolution issues.

DO $$
DECLARE
    table_exists BOOLEAN;
    pk_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'RolePermission' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT EXISTS(
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'RolePermission' AND constraint_type = 'PRIMARY KEY' AND table_schema = 'public'
        ) INTO pk_exists;
        
        IF NOT pk_exists THEN
            EXECUTE 'ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")';
            RAISE NOTICE 'Added RolePermission_pkey on id';
        ELSE
            RAISE NOTICE 'RolePermission_pkey already exists';
        END IF;
    ELSE
        RAISE NOTICE 'RolePermission table does not exist';
    END IF;
END $$;

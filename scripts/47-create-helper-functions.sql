-- Create helper function to check if column exists
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- Create helper function to create the check_column_exists function
CREATE OR REPLACE FUNCTION create_check_column_function()
RETURNS void AS $$
BEGIN
    -- This function ensures the check_column_exists function is available
    -- It's called from the React component to ensure the helper function exists
    PERFORM check_column_exists('embarques', 'id');
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_column_exists(text, text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION create_check_column_function() TO PUBLIC;

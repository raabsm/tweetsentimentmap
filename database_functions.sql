-- Function to extract the country and one set of coordinates from the data and load it into separate columns

CREATE OR REPLACE FUNCTION generate_country_coords()
 RETURNS trigger
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN

    -- When the tweets come back from tweepy, if the place is empty, the string 'null' is added.
    -- We remove that string here and make it null.
    If (new.place='null') THEN
        new.place := null;
    -- Otherwise, if there is a real place, extract country and coordinates.
    elsif (new.place IS NOT NULL) then
        NEW.country := new.place->'country';
        new.coord1 := (new.place->'bounding_box'->'coordinates'->0->0->0)::numeric;
        new.coord2 := (new.place->'bounding_box'->'coordinates'->0->0->1)::numeric;

    end if;

    RETURN NEW;

END;

$function$;

-- Trigger that calls the function whenever a new tweet is uploaded to the database. 
create trigger generate_country_coords_trigger before insert or update on tweets for each row execute procedure generate_country_coords();

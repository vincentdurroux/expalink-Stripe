-- 1. Ajout de la colonne cancel_at_period_end si elle n'existe pas encore
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'cancel_at_period_end') THEN
        ALTER TABLE public.profiles ADD COLUMN cancel_at_period_end boolean DEFAULT false;
    END IF;
END $$;

-- 2. Création ou mise à jour de la fonction de gestion des abonnements
CREATE OR REPLACE FUNCTION public.handle_plan_duration_logic()
RETURNS TRIGGER AS $$
BEGIN
    -- CAS A : ACTIVATION OU RÉACTIVATION (Passage à 'active')
    -- Se déclenche si le statut devient 'active' alors qu'il ne l'était pas (nouveau ou réactivation après annulation)
    IF (NEW.plan_status = 'active' AND (OLD.plan_status IS DISTINCT FROM 'active' OR OLD.pro_plan IS DISTINCT FROM NEW.pro_plan)) THEN
        
        -- Si c'est un plan Membre Fondateur ou Annuel, on donne 1 an à partir de maintenant
        IF NEW.pro_plan ILIKE '%founding%' OR NEW.pro_plan ILIKE '%annual%' THEN
            NEW.subscription_ends_at := NOW() + INTERVAL '1 year';
        -- Si c'est un plan mensuel, on donne 1 mois
        ELSIF NEW.pro_plan ILIKE '%monthly%' THEN
            NEW.subscription_ends_at := NOW() + INTERVAL '1 month';
        END IF;
        
        -- Toujours réinitialiser le drapeau de résiliation lors d'une activation/réactivation
        NEW.cancel_at_period_end := false;
        NEW.is_subscribed := true;
    END IF;

    -- CAS B : RÉSILIATION (Passage de 'active' vers 'cancelling')
    IF (NEW.plan_status = 'cancelling' AND OLD.plan_status = 'active') THEN
        NEW.cancel_at_period_end := true;
        
        -- Règle Membre Fondateur : accès réduit à 1 mois en cas de départ
        IF OLD.pro_plan ILIKE '%founding%' THEN
            NEW.subscription_ends_at := NOW() + INTERVAL '1 month';
        END IF;
    END IF;

    -- CAS C : EXPIRATION
    IF (NEW.plan_status = 'expired' OR NEW.pro_plan IS NULL) THEN
        NEW.is_subscribed := false;
        NEW.cancel_at_period_end := false;
        NEW.is_profile_online := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Création du Trigger
DROP TRIGGER IF EXISTS tr_plan_duration ON public.profiles;
CREATE TRIGGER tr_plan_duration
BEFORE UPDATE OF pro_plan, plan_status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_plan_duration_logic();
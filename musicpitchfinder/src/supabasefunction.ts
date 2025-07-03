import { supabase } from './supabase';

export const  getMusicData = async () => {
    const Music = await supabase.from("music").select("*");
    return Music;
}
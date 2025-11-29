import { supabase } from './supabaseClient.js';

export const searchUserStories = async (query) => {
  try {
    if (!query) return [];

    const isNumber = /^\d+$/.test(query);
    let dbQuery = supabase.from('user_stories').select('*').limit(10);

    if (isNumber) {
      dbQuery = dbQuery.or(`numero.eq.${query},title.ilike.%${query}%`);
    } else {
      dbQuery = dbQuery.ilike('title', `%${query}%`);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching user stories:', error);
    return [];
  }
};

export const createUserStory = async (numero, title) => {
  try {
    const { data, error } = await supabase
      .from('user_stories')
      .insert([{ numero: parseInt(numero), title }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user story:', error);
    throw error;
  }
};

export const deleteUserStory = async (id) => {
  try {
    const { error } = await supabase
      .from('user_stories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user story:', error);
    throw error;
  }
};

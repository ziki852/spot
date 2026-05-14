export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

export type Place = {
  id: string;
  google_place_id: string;
  name: string;
  slug: string;
  category: string;
  address: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
  google_rating: number | null;
  photo_refs: string[];
  post_count: number;
};

export type Post = {
  id: string;
  user_id: string;
  place_id: string | null;
  title: string;
  body: string;
  images: string[];
  tags: string[];
  rating: number | null;
  rating_food?: number | null;
  rating_service?: number | null;
  rating_vibe?: number | null;
  rating_value?: number | null;
  is_public: boolean;
  like_count: number;
  created_at: string;
  author?: Profile;
  place?: Place | null;
};

export type Like = {
  user_id: string;
  post_id: string;
};

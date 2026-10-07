/** Form draft values as strings (age) plus the consent checkbox. */
export type DetailsDraft = {
  full_name: string;
  age: string;
  email: string;
  whatsapp: string;
  position: string;
  current_club: string;
  previous_clubs: string;
  playing_level: string;
  country: string;
  help_required: string;
  situation_description: string;
  social_profile: string;
  highlight_video_url: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone: string;
  guardian_consent: boolean;
};

export const emptyDetails: DetailsDraft = {
  full_name: "",
  age: "",
  email: "",
  whatsapp: "",
  position: "",
  current_club: "",
  previous_clubs: "",
  playing_level: "",
  country: "South Africa",
  help_required: "",
  situation_description: "",
  social_profile: "",
  highlight_video_url: "",
  guardian_name: "",
  guardian_email: "",
  guardian_phone: "",
  guardian_consent: false,
};

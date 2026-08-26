export type PropertyDocument = { id:string; name:string; url:string; type?:string; size?:number; createdAt?:string };
export type Property = {
  id: string | number;
  title: string;
  code: string;
  type: string;
  deal: string;
  area: number;
  rooms: number;
  district: string;
  city: string;
  price: number;
  status: string;
  owner: string;
  agent: string;
  image: string;
  images?: string[];
  documents?: PropertyDocument[];
  created: string;
  floor: number;
  age: number;
  features: string[];
};

export type Person = {
  id: number;
  name: string;
  phone: string;
  agent: string;
  note: string;
};

create table if not exists users (
  id bigint generated always as identity primary key,
  name varchar(20) not null,
  email text not null unique,
  password_hash text not null
);

create table if not exists staffs (
  id bigint generated always as identity primary key,
  name varchar(20) not null,
  position varchar(20) not null,
  join_date date not null,
  active boolean not null default true,
  note varchar(200) not null default ''
);

create table if not exists tasks (
  id bigint generated always as identity primary key,
  name varchar(30) not null,
  position varchar(20) not null,
  unique (name, position)
);

create table if not exists skills (
  id bigint generated always as identity primary key,
  staff_id bigint not null references staffs(id) on delete cascade,
  task_id bigint not null references tasks(id) on delete cascade,
  level int not null check (level between 1 and 3),
  updated_on date not null,
  unique (staff_id, task_id)
);

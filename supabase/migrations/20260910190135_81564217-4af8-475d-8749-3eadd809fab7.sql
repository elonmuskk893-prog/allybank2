do $$
declare r record;
begin
  for r in
    select id, user_id, amount, fee, currency
    from public.transactions
    where status = 'pending'
      and kind = 'transfer'
      and direction = 'debit'
      and hold_settled_at is null
      and hold_released_at is null
      and created_at < now() - interval '30 minutes'
  loop
    update public.transactions
       set status = 'cancelled', hold_released_at = now()
     where id = r.id;
    update public.transactions
       set status = 'cancelled'
     where reference = (select reference from public.transactions where id = r.id)
       and kind = 'transfer' and direction = 'credit' and status = 'pending';
    perform public.release_hold(r.user_id, round(r.amount + coalesce(r.fee, 0), 2), r.currency);
  end loop;
end $$;
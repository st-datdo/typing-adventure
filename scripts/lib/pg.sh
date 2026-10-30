#!/usr/bin/env bash

urldecode() {
  local s=${1//\\/\\\\}
  printf '%b' "${s//%/\\x}"
}

pg_fields() {
  awk '
    /^DATABASE_URL=/ {
      v = substr($0, 14)
      gsub(/^"|"$/, "", v)
      sub(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "", v)
      q = index(v, "?")
      query = (q == 0) ? "" : substr(v, q + 1)
      if (q > 0) v = substr(v, 1, q - 1)
      slash = index(v, "/")
      db = (slash > 0) ? substr(v, slash + 1) : ""
      auth = (slash > 0) ? substr(v, 1, slash - 1) : v
      userinfo = ""
      at = 0
      for (i = length(auth); i > 0; i--) if (substr(auth, i, 1) == "@") { at = i; break }
      if (at > 0) { userinfo = substr(auth, 1, at - 1); auth = substr(auth, at + 1) }
      c = index(userinfo, ":")
      user = (c > 0) ? substr(userinfo, 1, c - 1) : userinfo
      pw = (c > 0) ? substr(userinfo, c + 1) : ""
      if (substr(auth, 1, 1) == "[") {
        cb = index(auth, "]")
        host = substr(auth, 2, cb - 2)
        rest = substr(auth, cb + 1)
        port = (substr(rest, 1, 1) == ":") ? substr(rest, 2) : ""
      } else {
        c = index(auth, ":")
        host = (c > 0) ? substr(auth, 1, c - 1) : auth
        port = (c > 0) ? substr(auth, c + 1) : ""
      }
      sslmode = ""
      ctimeout = ""
      n = split(query, parts, "&")
      for (i = 1; i <= n; i++) {
        if (parts[i] ~ /^sslmode=/) sslmode = substr(parts[i], 9)
        if (parts[i] ~ /^connect_timeout=/) ctimeout = substr(parts[i], 17)
      }
      print user; print pw; print host; print port; print db; print sslmode; print ctimeout
      exit
    }
  ' "$1"
}

pg_exec() {
  local env_file="$1" sql="$2" fields u pw h p d sm ct
  fields=$(pg_fields "$env_file")
  {
    IFS= read -r u
    IFS= read -r pw
    IFS= read -r h
    IFS= read -r p
    IFS= read -r d
    IFS= read -r sm
    IFS= read -r ct
  } <<< "$fields"
  [ -n "$h" ] && [ -n "$d" ] || return 1
  (
    unset PGHOSTADDR PGSERVICE PGSERVICEFILE PGOPTIONS PGPASSFILE
    PGPASSWORD=$(urldecode "$pw")
    export PGPASSWORD
    if [ -n "$sm" ]; then export PGSSLMODE="$sm"; fi
    if [ -n "$ct" ]; then export PGCONNECT_TIMEOUT="$ct"; fi
    exec psql -X -h "$h" -p "${p:-5432}" -U "$(urldecode "$u")" -d "$(urldecode "$d")" \
      -v ON_ERROR_STOP=1 -qAt -c "$sql"
  )
}

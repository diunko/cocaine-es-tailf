
### Display logs from ElasticSearch in tail -f manner

#### Installation

```
> npm install -g cocaine-es-tailf
```

#### Usage

Stream logs with command:
```
$ es-tailf --es-host elastic01d.tst.ape.yandex.net --source-path '*user-name*'
```

which is an equivalent of querying kibana with query `*` and filter
`@source_path:(*user-name*)`.

##### Other options available:

`es-host` (required) -- ElasticSearch host to query

`es-port` (by default 9200)

`source-path` (required) -- equivalent of `@source_path` field in kibana

`source-host` (by default *) -- equivalent of `@source_host` field in kibana

`-f` (specify many times for multiple fields) -- fields to display in
search result, `['@timestamp', '@source_host', '@source_path', '@message']`
by-default.


The above example is an equivalent of command:

```
$ es-tailf --es-host elastic01d.tst.ape.yandex.net \
    --es-port 9200 \
    --source-path '*user-name*' \
    --source-host '*' \
    -f @timestamp -f @source_host -f source_path -f @message
```

#### BUGS

Probably many unknown; if encounter something, run with
`DEBUG=es-tailf`, and please send bug report.


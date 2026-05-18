#!/usr/bin/env bash
# Mandatory E2E smoke through the LB (PRD NFR-3 / FR-4.3): signed SigV4 PutObject,
# large auto-multipart, presigned URL round-trip. Run in CI against a freshly
# installed env's S3 endpoint before a tag may enter the vers.yaml allowlist.
#
# Usage: S3_ENDPOINT=https://s3.example.com S3_KEY=... S3_SECRET=... ./tests/s3-smoke.sh
set -euo pipefail

: "${S3_ENDPOINT:?set S3_ENDPOINT}"
: "${S3_KEY:?set S3_KEY}"
: "${S3_SECRET:?set S3_SECRET}"

export AWS_ACCESS_KEY_ID="$S3_KEY"
export AWS_SECRET_ACCESS_KEY="$S3_SECRET"
export AWS_DEFAULT_REGION="us-east-1"
AWS="aws --endpoint-url ${S3_ENDPOINT}"
BUCKET="smoke-$(date +%s)"

# force path-style (FR-3.8): rely on endpoint + path addressing
aws configure set default.s3.addressing_style path

echo "1) bucket + signed PutObject (SigV4 through LB)"
$AWS s3 mb "s3://${BUCKET}"
echo "hello-rustfs" > /tmp/_s3smoke_small
$AWS s3api put-object --bucket "$BUCKET" --key small.txt --body /tmp/_s3smoke_small

echo "2) large auto-multipart upload (>8MB triggers multipart)"
head -c 25000000 /dev/urandom > /tmp/_s3smoke_big
$AWS s3 cp /tmp/_s3smoke_big "s3://${BUCKET}/big.bin"
$AWS s3 ls "s3://${BUCKET}/big.bin"

echo "3) presigned URL round-trip (host must match public endpoint)"
URL=$($AWS s3 presign "s3://${BUCKET}/small.txt")
test "$(curl -fsS "$URL")" = "hello-rustfs"

echo "4) cleanup"
$AWS s3 rm "s3://${BUCKET}" --recursive
$AWS s3 rb "s3://${BUCKET}"
echo "S3 SMOKE PASSED"

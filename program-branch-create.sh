echo "Usage: ./create-branch.sh program_codename username modifier"
echo "  modifier is an arbitrary string, e.g. explaining the task, objective or simply the date of changes introduction"
git checkout -b "data-$1-$2-$3"
(cd data-delivery-roadmap && dolt branch "data-$1-$2-$3")
(cd data-delivery-roadmap && dolt checkout "data-$1-$2-$3")

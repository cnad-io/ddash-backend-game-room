# OpenShift Applier for App

This is an OpenShift applier inventory. I'm assuming you know how to do that, else see the CI/CD repo for docs.

## Dependencies

* Ansible 2.5.14.
* Python 2.7.15.
* OC CLI with the OCP version.

## Usage

Right now limited to using ansible on your localhost.

1. `[.openshift-applier]$ ansible-galaxy install -r requirements.yml --roles-path=roles --f`

2. `[.openshift-applier]$ ansible-playbook --ask-vault-pass apply.yml -i inventory/`

See the inventory for the filter tag options.

If you want to run it over containers, use the image `quay.io/redhat/do500-toolbox`.

```bash
# Create the temporary container to execeute ansible
$ docker run --rm -it -v "$(pwd)":/home/tool-box/workarea:Z quay.io/redhat/do500-toolbox /bin/bash
# Login to OCP
bash-4.4$ oc login <console-url>
# Go to the openshift applier folder
bash-4.4$ cd /home/tool-box/workarea/.openshift-applier/
# Install openshift applier role
bash-4.4$ ansible-galaxy install -r requirements.yml --roles-path=roles --f
# And finally, execute the ansible playbook
bash-4.4$ ansible-playbook apply.yml -i inventory/
```
